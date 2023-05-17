#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
#include <mutex>
#include <thread>

class ColumnStore
{
public:
    void insert(const std::string &columnName, const std::string &value)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto &column = getColumn(columnName);
        auto newVersion = createNewVersion();

        for (auto &entry : column)
        {
            if (entry.first <= currentVersion_)
            {
                entry.second.push_back(value);
            }
            else
            {
                entry.second.push_back(value); // Clone value if needed
            }
            incrementVersion(entry.first);
        }

        column[newVersion] = {value};
    }

    void bulkInsert(const std::string &columnName, const std::vector<std::string> &values)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto &column = getColumn(columnName);
        auto newVersion = createNewVersion();

        for (auto &entry : column)
        {
            if (entry.first <= currentVersion_)
            {
                entry.second.insert(entry.second.end(), values.begin(), values.end());
            }
            else
            {
                entry.second.insert(entry.second.end(), values.begin(), values.end()); // Clone values if needed
            }
            incrementVersion(entry.first);
        }

        column[newVersion] = values;
    }

    void erase(const std::string &columnName, int version)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto &column = getColumn(columnName);
        auto ver = getVersion(version);
        auto it = column.find(ver);

        if (it != column.end())
        {
            it->second.pop_back();
            incrementVersion(ver);
        }
    }

    void bulkErase(const std::string &columnName, int version, int count)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto &column = getColumn(columnName);
        auto ver = getVersion(version);
        auto it = column.find(ver);

        if (it != column.end())
        {
            auto &entries = it->second;
            if (count >= entries.size())
            {
                entries.clear();
            }
            else
            {
                entries.resize(entries.size() - count);
            }
            incrementVersion(ver);
        }
    }

    std::vector<std::string> get(const std::string &columnName, int version)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto &column = getColumn(columnName);
        auto ver = getVersion(version);
        auto it = column.find(ver);
        if (it != column.end())
        {
            return it->second;
        }
        return {};
    }

private:
    std::unordered_map<std::string, std::unordered_map<int, std::vector<std::string>>> columns_;
    std::unordered_map<int, int> versions_;
    int currentVersion_ = 0;
    std::mutex mutex_;

    std::unordered_map<int, std::vector<std::string>> &getColumn(const std::string &columnName)
    {
        return columns_[columnName];
    }

    int getVersion(int version)
    {
        auto it = versions_.find(version);
        if (it == versions_.end())
        {
            it = versions_.insert({version, 0}).first;
        }
        return it->second;
    }

    int createNewVersion()
    {
        int newVersion = currentVersion_ + 1;
        currentVersion_ = newVersion;
        versions_[newVersion] = 0;
        return newVersion;
    }

    void incrementVersion(int version)
    {
        auto it = versions_.find(version);
        if (it != versions_.end())
        {
            it->second++;
        }
    }
};

int main()
{
    ColumnStore store;

    std::thread t1([&store]()
                   {
        store.insert("Column1", "Value1");
        store.insert("Column1", "Value2");
        store.insert("Column1", "Value3");
        store.bulkInsert("Column2", { "ValueA", "ValueB", "ValueC" });
        store.erase("Column1", 2);
        store.bulkErase("Column2", 1, 2); });

    std::thread t2([&store]()
                   {
        store.insert("Column1", "Value4");
        store.insert("Column1", "Value5");
        store.bulkInsert("Column2", { "ValueD", "ValueE", "ValueF" });
        store.erase("Column1", 1);
        store.bulkErase("Column2", 1, 1); });

    t1.join();
    t2.join();

    auto values1 = store.get("Column1", 2);
    std::cout << "Column1 (Version 2): ";
    for (const auto &value : values1)
    {
        std::cout << value << " ";
    }
    std::cout << std::endl;

    auto values2 = store.get("Column2", 2);
    std::cout << "Column2 (Version 2): ";
    for (const auto &value : values2)
    {
        std::cout << value << " ";
    }
    std::cout << std::endl;

    return 0;
}
